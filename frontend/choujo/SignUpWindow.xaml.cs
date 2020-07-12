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
	public partial class SignUpWindow : Window
	{
		public SignUpWindow()
		{
			InitializeComponent();
			notification_dropdown.Items.Add("None");
			notification_dropdown.Items.Add("Low/High Tide");
			notification_dropdown.Items.Add("Abnormally Low/High Tide");
			notification_dropdown.SelectedIndex = 0;

		}

		private void btn_submit_Click(object sender, RoutedEventArgs e)
		{
			if (string.IsNullOrWhiteSpace(family_name.Text)
				|| string.IsNullOrWhiteSpace(given_name.Text)
				|| string.IsNullOrWhiteSpace(email.Text)
				|| string.IsNullOrWhiteSpace(password.Text)
				|| (phone_chkbx.IsChecked.GetValueOrDefault() && string.IsNullOrWhiteSpace(phone_number.Text)))
			{
				MessageBox.Show("Please confirm you filled out everything and try again.", "help");
			}
			else
			{
				HttpWebRequest request = (HttpWebRequest)WebRequest.Create("http://192.168.1.238:1110/api/user/add");
				request.ContentType = "application/json";
				request.Method = "POST";
				using (StreamWriter dataStream = new StreamWriter(request.GetRequestStream()))
				{

					string json = new JavaScriptSerializer().Serialize(new
						{
							family_name = family_name.Text,
							given_name = given_name.Text,
							email = email.Text,
							phone_number = phone_number.Text,
							password = password.Text,
							phone_notification = Convert.ToInt32(phone_chkbx.IsChecked),
							notification = notification_dropdown.SelectedIndex,
							brisbane_bar = Convert.ToInt32(brisbane_chkbx.IsChecked),
							southport = Convert.ToInt32(southport_chkbx.IsChecked),
							mooloolaba = Convert.ToInt32(mooloolaba_chkbx.IsChecked)
						});
					dataStream.Write(json);
				}

				try
				{
					HttpWebResponse httpWebResponse = (HttpWebResponse)request.GetResponse();
					using (StreamReader stream = new StreamReader(httpWebResponse.GetResponseStream()))
					{
						string result = stream.ReadToEnd();
						MessageBox.Show("Signed Up");
						this.Close();
					}
				}
				catch (WebException err)
				{
					MessageBox.Show("Email in use, please try again");
				}
			}
		}
	}
}
