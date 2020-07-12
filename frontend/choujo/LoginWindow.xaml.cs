using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;

namespace choujo
{
	/// <summary>
	/// Interaction logic for Window2.xaml
	/// </summary>
	public partial class LoginWindow : Window
	{
		public LoginWindow()
		{
			InitializeComponent();
		}

		private void btn_submit_Click(object sender, RoutedEventArgs e)
		{
			if (string.IsNullOrWhiteSpace(email.Text)
				|| string.IsNullOrWhiteSpace(password.Text))
			{
				MessageBox.Show("Please confirm you filled out everything and try again.", "help");
			}
			else
			{
				HttpWebRequest request = (HttpWebRequest)WebRequest.Create("http://192.168.1.238:1110/api/user/check");
				request.ContentType = "application/json";
				request.Method = "POST";
				using (StreamWriter dataStream = new StreamWriter(request.GetRequestStream()))
				{

					string json = new JavaScriptSerializer().Serialize(new
						{
							email = email.Text,
							password = password.Text,
						});
					dataStream.Write(json);
				}

				try
				{
					HttpWebResponse httpWebResponse = (HttpWebResponse)request.GetResponse();
					using (StreamReader stream = new StreamReader(httpWebResponse.GetResponseStream()))
					{
						string site_data = stream.ReadToEnd();
						MessageBox.Show("Logged in");
						new Window2(site_data).Show();
						this.Close();
					}
				}
				catch (WebException err)
				{
					MessageBox.Show("Email in use, please try again");
				}
			}
		}

		private void Button_Click(object sender, RoutedEventArgs e)
		{
			new SignUpWindow().Show();
			this.Close();
		}
	}
}
